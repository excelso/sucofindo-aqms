<select class="form-control select2-custom {{$class}}" name="{{$name}}" data-selected="{{$selected}}" {{$disabled}}>
    @foreach($dataBulan as $index => $val)
        @php($select = '')
        @if($selected != '')
            @if($selected == $index)
                @php($select = 'selected')
            @endif
        @else
            @if($index == date('m'))
                @php($select = 'selected')
            @endif
        @endif
        <option {{$select}} value="{{$index}}">{{$val}}</option>
    @endforeach
</select>
